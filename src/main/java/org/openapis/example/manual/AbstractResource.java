/*
 * Copyright 2016 Capital One Services, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License. 
 */

package org.openapis.example.manual;

import static java.util.stream.Collectors.toList;

import java.time.LocalDateTime;
import java.util.List;

import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import org.apache.commons.lang3.RandomStringUtils;
import org.openapis.example.common.PaginatedList;
import org.openapis.example.common.Repository;
import org.openapis.example.manual.Auditable;

public abstract class AbstractResource<T extends Entity> {
	private Repository<T> service;

	public AbstractResource(Repository<T> service) {
		this.service = service;
	}

	@POST
	public T create(T entity) {
		if (entity instanceof Auditable) {
			LocalDateTime now = LocalDateTime.now();
			String user = getUserName();
			Auditable auditable = (Auditable) entity;
			auditable.setCreatedBy(user);
			auditable.setCreatedDate(now);
			auditable.setModifiedBy(user);
			auditable.setModifiedDate(now);
		}

		return service.insert(entity);
	}

	@POST
	@Path("/many")
	public PaginatedList<T> createMany(PaginatedList<T> list) {
		LocalDateTime now = LocalDateTime.now();
		String user = getUserName();

		List<T> entities = list.getItems().stream().map(entity -> {
			if (entity instanceof Auditable) {
				Auditable auditable = (Auditable) entity;
				auditable.setCreatedBy(user);
				auditable.setCreatedDate(now);
				auditable.setModifiedBy(user);
				auditable.setModifiedDate(now);
			}

			return entity;
		}).collect(toList());

		return new PaginatedList<T>(service.insert(entities));
	}

	@GET
	public PaginatedList<T> findAll() {
		return new PaginatedList<T>(service.findAll());
	}

	@GET
	@Path("/{id}")
	public T findById(@PathParam("id") String id) {
		T entity = service.findOne(id);

		if (entity == null) {
			throw new NotFoundException();
		}

		return entity;
	}

	@PUT
	@Path("/{id}")
	public T update(@PathParam("id") String id, T entity) {
		T existing = service.findOne(id);

		if (existing != null) {
			entity.setId(id);

			if (entity instanceof Auditable) {
				LocalDateTime now = LocalDateTime.now();
				String user = getUserName();
				Auditable auditable = (Auditable) entity;
				Auditable from = (Auditable) existing;
				auditable.setCreatedBy(from.getCreatedBy());
				auditable.setCreatedDate(from.getCreatedDate());
				auditable.setModifiedBy(user);
				auditable.setModifiedDate(now);
			}

			return service.save(entity);
		} else {
			throw new NotFoundException();
		}
	}

	@DELETE
	@Path("/{id}")
	public void deleteById(@PathParam("id") String id) {
		service.delete(id);
	}

	private String getUserName() {
		return RandomStringUtils.randomAlphabetic(6);
	}
}
