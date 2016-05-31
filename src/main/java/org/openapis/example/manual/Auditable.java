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

import java.time.LocalDateTime;

public interface Auditable {
	String getCreatedBy();

	void setCreatedBy(String createdBy);

	LocalDateTime getCreatedDate();

	void setCreatedDate(LocalDateTime createdDate);

	String getModifiedBy();

	void setModifiedBy(String modifiedBy);

	LocalDateTime getModifiedDate();

	void setModifiedDate(LocalDateTime modifiedDate);
}