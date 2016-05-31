package org.openapis.example.nodegen;

import java.time.LocalDateTime;

public interface EntityBuilder<T> {
	public EntityBuilder<T> setId(String id);

	public EntityBuilder<T> setCreated(String createdBy, LocalDateTime createdDate);

	public EntityBuilder<T> setModified(String modifiedBy, LocalDateTime modifiedDate);

	public T build();
}
